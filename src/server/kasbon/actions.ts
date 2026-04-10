"use server";

import type { FormActionState } from "@/server/form-state";

import {
  archiveKasbonRecordAction as archiveKasbonRecordActionInternal,
  createKasbonRecordAction as createKasbonRecordActionInternal,
  restoreKasbonRecordAction as restoreKasbonRecordActionInternal,
  updateKasbonRecordAction as updateKasbonRecordActionInternal,
} from "@/server/kasbon/records";

export async function createKasbonRecordAction(
  prevState: FormActionState,
  formData: FormData,
) {
  return createKasbonRecordActionInternal(prevState, formData);
}

export async function updateKasbonRecordAction(
  prevState: FormActionState,
  formData: FormData,
) {
  return updateKasbonRecordActionInternal(prevState, formData);
}

export async function archiveKasbonRecordAction(formData: FormData) {
  return archiveKasbonRecordActionInternal(formData);
}

export async function restoreKasbonRecordAction(formData: FormData) {
  return restoreKasbonRecordActionInternal(formData);
}
