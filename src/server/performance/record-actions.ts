"use server";

import type { FormActionState } from "@/server/form-state";

import {
  archivePerformanceRecordAction as archivePerformanceRecordActionInternal,
  createPerformanceRecordAction as createPerformanceRecordActionInternal,
  restorePerformanceRecordAction as restorePerformanceRecordActionInternal,
  updatePerformanceRecordAction as updatePerformanceRecordActionInternal,
} from "@/server/performance/records";

export async function createPerformanceRecordAction(
  prevState: FormActionState,
  formData: FormData,
) {
  return createPerformanceRecordActionInternal(prevState, formData);
}

export async function updatePerformanceRecordAction(
  prevState: FormActionState,
  formData: FormData,
) {
  return updatePerformanceRecordActionInternal(prevState, formData);
}

export async function archivePerformanceRecordAction(formData: FormData) {
  return archivePerformanceRecordActionInternal(formData);
}

export async function restorePerformanceRecordAction(formData: FormData) {
  return restorePerformanceRecordActionInternal(formData);
}
