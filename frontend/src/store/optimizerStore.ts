import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { OptimizationFormData } from '@/types';

interface OptimizerState {
  step: number;
  formData: Partial<OptimizationFormData>;
  submittedRequestId: string | null;
  isSubmitting: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateForm: (data: Partial<OptimizationFormData>) => void;
  setSubmittedRequestId: (id: string | null) => void;
  setSubmitting: (v: boolean) => void;
  reset: () => void;
}

export const useOptimizerStore = create<OptimizerState>()(
  devtools(
    (set) => ({
      step: 1,
      formData: {},
      submittedRequestId: null,
      isSubmitting: false,

      setStep: (step) => set({ step }),
      nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 5) })),
      prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),
      updateForm: (data) => set((s) => ({ formData: { ...s.formData, ...data } })),
      setSubmittedRequestId: (submittedRequestId) => set({ submittedRequestId }),
      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      reset: () => set({ step: 1, formData: {}, submittedRequestId: null, isSubmitting: false }),
    }),
    { name: 'optimizer-store' }
  )
);
