export const FormAction = {
  CREATE: "create",
  UPDATE: "update",
} as const;

export type FormAction = (typeof FormAction)[keyof typeof FormAction];
