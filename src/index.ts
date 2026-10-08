#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HevyClient } from "./hevy-client.js";

const apiKey = process.env.HEVY_API_KEY;
if (!apiKey) {
  console.error("HEVY_API_KEY não definido. Gere em https://hevy.com/settings?developer");
  process.exit(1);
}

const hevy = new HevyClient(apiKey);
const server = new McpServer({ name: "hevy", version: "0.1.0" });

const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });

async function run(fn: () => Promise<unknown>) {
  try {
    return json(await fn());
  } catch (err) {
    return { isError: true, content: [{ type: "text" as const, text: String(err instanceof Error ? err.message : err) }] };
  }
}

const readOnly = { readOnlyHint: true, openWorldHint: true };
const write = { readOnlyHint: false, destructiveHint: false, openWorldHint: true };

// ---------- Shared schemas ----------

const id = z.string().describe("ID retornado pela API");
const maxItems = (def: number, max: number) =>
  z.number().int().min(1).max(max).default(def).describe(`Máximo de itens a retornar (paginação automática, até ${max})`);

const setType = z.enum(["warmup", "normal", "failure", "dropset"]).default("normal");

const workoutSet = z.object({
  type: setType,
  weight_kg: z.number().nullish(),
  reps: z.number().int().nullish(),
  distance_meters: z.number().nullish(),
  duration_seconds: z.number().nullish(),
  custom_metric: z.number().nullish(),
  rpe: z.number().min(6).max(10).nullish().describe("6, 7, 7.5, 8, 8.5, 9, 9.5 ou 10"),
});

const workoutExercise = z.object({
  exercise_template_id: z.string().describe("Use list_exercise_templates para descobrir o ID"),
  superset_id: z.number().int().nullish(),
  notes: z.string().nullish(),
  sets: z.array(workoutSet).min(1),
});

const workoutBody = z.object({
  title: z.string(),
  description: z.string().nullish(),
  start_time: z.string().describe("ISO 8601, ex.: 2026-10-08T07:00:00Z"),
  end_time: z.string().describe("ISO 8601"),
  is_private: z.boolean().default(false),
  exercises: z.array(workoutExercise).min(1),
});

const routineSet = z.object({
  type: setType,
  weight_kg: z.number().nullish(),
  reps: z.number().int().nullish(),
  distance_meters: z.number().nullish(),
  duration_seconds: z.number().nullish(),
  custom_metric: z.number().nullish(),
  rep_range: z.object({ start: z.number().int(), end: z.number().int() }).nullish(),
});

const routineExercise = z.object({
  exercise_template_id: z.string(),
  superset_id: z.number().int().nullish(),
  rest_seconds: z.number().int().nullish(),
  notes: z.string().nullish(),
  sets: z.array(routineSet).min(1),
});

const measurementFields = {
  weight_kg: z.number().nullish(),
  lean_mass_kg: z.number().nullish(),
  fat_percent: z.number().nullish(),
  neck_cm: z.number().nullish(),
  shoulder_cm: z.number().nullish(),
  chest_cm: z.number().nullish(),
  left_bicep_cm: z.number().nullish(),
  right_bicep_cm: z.number().nullish(),
  left_forearm_cm: z.number().nullish(),
  right_forearm_cm: z.number().nullish(),
  abdomen: z.number().nullish(),
  waist: z.number().nullish(),
  hips: z.number().nullish(),
  left_thigh: z.number().nullish(),
  right_thigh: z.number().nullish(),
  left_calf: z.number().nullish(),
  right_calf: z.number().nullish(),
};
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("YYYY-MM-DD");

// ---------- User ----------

server.registerTool(
  "get_user_info",
  { description: "Informações do usuário Hevy autenticado.", annotations: readOnly },
  () => run(() => hevy.get("/v1/user/info")),
);

// ---------- Workouts ----------

server.registerTool(
  "list_workouts",
  {
    description: "Lista treinos do mais recente para o mais antigo, com exercícios e séries.",
    inputSchema: { max_items: maxItems(10, 200) },
    annotations: readOnly,
  },
  ({ max_items }) => run(() => hevy.paginate("/v1/workouts", "workouts", 10, max_items)),
);

server.registerTool(
  "get_workout_count",
  { description: "Número total de treinos da conta.", annotations: readOnly },
  () => run(() => hevy.get("/v1/workouts/count")),
);

server.registerTool(
  "get_workout_events",
  {
    description:
      "Eventos de treino (atualizados/excluídos) desde uma data, do mais recente ao mais antigo. Ideal para sincronização incremental.",
    inputSchema: { since: z.string().describe("ISO 8601, ex.: 2026-10-01T00:00:00Z"), max_items: maxItems(50, 500) },
    annotations: readOnly,
  },
  ({ since, max_items }) => run(() => hevy.paginate("/v1/workouts/events", "events", 10, max_items, { since })),
);

server.registerTool(
  "get_workout",
  { description: "Detalhes completos de um treino.", inputSchema: { workout_id: id }, annotations: readOnly },
  ({ workout_id }) => run(() => hevy.get(`/v1/workouts/${encodeURIComponent(workout_id)}`)),
);

server.registerTool(
  "create_workout",
  { description: "Registra um novo treino no Hevy.", inputSchema: { workout: workoutBody }, annotations: write },
  ({ workout }) => run(() => hevy.post("/v1/workouts", { workout })),
);

server.registerTool(
  "update_workout",
  {
    description: "Substitui um treino existente (envie o treino completo).",
    inputSchema: { workout_id: id, workout: workoutBody },
    annotations: { ...write, destructiveHint: true, idempotentHint: true },
  },
  ({ workout_id, workout }) => run(() => hevy.put(`/v1/workouts/${encodeURIComponent(workout_id)}`, { workout })),
);

// ---------- Routines ----------

server.registerTool(
  "list_routines",
  { description: "Lista rotinas (planos de treino).", inputSchema: { max_items: maxItems(20, 200) }, annotations: readOnly },
  ({ max_items }) => run(() => hevy.paginate("/v1/routines", "routines", 10, max_items)),
);

server.registerTool(
  "get_routine",
  { description: "Obtém uma rotina pelo ID.", inputSchema: { routine_id: id }, annotations: readOnly },
  ({ routine_id }) => run(() => hevy.get(`/v1/routines/${encodeURIComponent(routine_id)}`)),
);

server.registerTool(
  "create_routine",
  {
    description: "Cria uma rotina. folder_id null = pasta padrão 'My Routines'.",
    inputSchema: {
      routine: z.object({
        title: z.string(),
        folder_id: z.number().int().nullish(),
        notes: z.string().nullish(),
        exercises: z.array(routineExercise).min(1),
      }),
    },
    annotations: write,
  },
  ({ routine }) => run(() => hevy.post("/v1/routines", { routine })),
);

server.registerTool(
  "update_routine",
  {
    description: "Substitui uma rotina existente (envie a rotina completa).",
    inputSchema: {
      routine_id: id,
      routine: z.object({ title: z.string(), notes: z.string().nullish(), exercises: z.array(routineExercise).min(1) }),
    },
    annotations: { ...write, destructiveHint: true, idempotentHint: true },
  },
  ({ routine_id, routine }) => run(() => hevy.put(`/v1/routines/${encodeURIComponent(routine_id)}`, { routine })),
);

// ---------- Routine folders ----------

server.registerTool(
  "list_routine_folders",
  { description: "Lista pastas de rotinas.", inputSchema: { max_items: maxItems(50, 200) }, annotations: readOnly },
  ({ max_items }) => run(() => hevy.paginate("/v1/routine_folders", "routine_folders", 10, max_items)),
);

server.registerTool(
  "get_routine_folder",
  { description: "Obtém uma pasta de rotinas pelo ID.", inputSchema: { folder_id: id }, annotations: readOnly },
  ({ folder_id }) => run(() => hevy.get(`/v1/routine_folders/${encodeURIComponent(folder_id)}`)),
);

server.registerTool(
  "create_routine_folder",
  { description: "Cria uma pasta de rotinas (entra no índice 0).", inputSchema: { title: z.string() }, annotations: write },
  ({ title }) => run(() => hevy.post("/v1/routine_folders", { routine_folder: { title } })),
);

// ---------- Exercise templates & history ----------

server.registerTool(
  "list_exercise_templates",
  {
    description:
      "Lista modelos de exercício (padrão + personalizados). Use `search` para filtrar pelo título localmente.",
    inputSchema: {
      search: z.string().optional().describe("Filtro por título (case-insensitive)"),
      max_items: maxItems(100, 1000),
    },
    annotations: readOnly,
  },
  ({ search, max_items }) =>
    run(async () => {
      // Busca todo o catálogo quando há filtro, já que a API não suporta busca.
      const all = await hevy.paginate<{ title?: string }>("/v1/exercise_templates", "exercise_templates", 100, search ? 5000 : max_items);
      const q = search?.toLowerCase();
      return (q ? all.filter((t) => t.title?.toLowerCase().includes(q)) : all).slice(0, max_items);
    }),
);

server.registerTool(
  "get_exercise_template",
  { description: "Obtém um modelo de exercício pelo ID.", inputSchema: { exercise_template_id: id }, annotations: readOnly },
  ({ exercise_template_id }) => run(() => hevy.get(`/v1/exercise_templates/${encodeURIComponent(exercise_template_id)}`)),
);

server.registerTool(
  "create_exercise_template",
  {
    description: "Cria um exercício personalizado.",
    inputSchema: {
      exercise: z.object({
        title: z.string(),
        exercise_type: z
          .string()
          .describe("weight_reps | reps_only | bodyweight_reps | bodyweight_assisted_reps | duration | weight_duration | distance_duration | short_distance_weight"),
        equipment_category: z
          .string()
          .describe("none | barbell | dumbbell | kettlebell | machine | plate | resistance_band | suspension | other"),
        muscle_group: z
          .string()
          .describe("abdominals | shoulders | biceps | triceps | forearms | quadriceps | hamstrings | calves | glutes | abductors | adductors | lats | upper_back | traps | lower_back | chest | cardio | neck | full_body | other"),
        other_muscles: z.array(z.string()).default([]),
      }),
    },
    annotations: write,
  },
  ({ exercise }) => run(() => hevy.post("/v1/exercise_templates", { exercise })),
);

server.registerTool(
  "get_exercise_history",
  {
    description: "Histórico de séries de um exercício (para progressão de carga, PRs etc.).",
    inputSchema: {
      exercise_template_id: id,
      start_date: z.string().optional().describe("ISO 8601"),
      end_date: z.string().optional().describe("ISO 8601"),
    },
    annotations: readOnly,
  },
  ({ exercise_template_id, start_date, end_date }) =>
    run(() => hevy.get(`/v1/exercise_history/${encodeURIComponent(exercise_template_id)}`, { start_date, end_date })),
);

// ---------- Body measurements ----------

server.registerTool(
  "list_body_measurements",
  { description: "Lista medidas corporais.", inputSchema: { max_items: maxItems(30, 500) }, annotations: readOnly },
  ({ max_items }) => run(() => hevy.paginate("/v1/body_measurements", "body_measurements", 10, max_items)),
);

server.registerTool(
  "get_body_measurement",
  { description: "Medida corporal de uma data.", inputSchema: { date }, annotations: readOnly },
  ({ date }) => run(() => hevy.get(`/v1/body_measurements/${date}`)),
);

server.registerTool(
  "create_body_measurement",
  {
    description: "Cria medida corporal para uma data (erro 409 se já existir — use update_body_measurement).",
    inputSchema: { date, ...measurementFields },
    annotations: write,
  },
  (args) => run(() => hevy.post("/v1/body_measurements", args)),
);

server.registerTool(
  "update_body_measurement",
  {
    description: "Sobrescreve a medida de uma data. ATENÇÃO: campos omitidos viram null — envie todos.",
    inputSchema: { date, ...measurementFields },
    annotations: { ...write, destructiveHint: true, idempotentHint: true },
  },
  ({ date, ...fields }) => run(() => hevy.put(`/v1/body_measurements/${date}`, fields)),
);

await server.connect(new StdioServerTransport());
