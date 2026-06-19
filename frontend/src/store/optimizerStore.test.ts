import { describe, it, expect, beforeEach } from 'vitest';
import { useOptimizerStore } from './optimizerStore';

describe('optimizerStore', () => {
  beforeEach(() => {
    useOptimizerStore.getState().reset();
  });

  it('initializes at step 1 with empty form', () => {
    const state = useOptimizerStore.getState();
    expect(state.step).toBe(1);
    expect(state.formData).toEqual({});
    expect(state.submittedRequestId).toBeNull();
    expect(state.isSubmitting).toBe(false);
  });

  it('nextStep increments step', () => {
    useOptimizerStore.getState().nextStep();
    expect(useOptimizerStore.getState().step).toBe(2);
  });

  it('nextStep caps at step 5', () => {
    const store = useOptimizerStore.getState();
    store.setStep(5);
    store.nextStep();
    expect(useOptimizerStore.getState().step).toBe(5);
  });

  it('prevStep decrements step', () => {
    useOptimizerStore.getState().setStep(3);
    useOptimizerStore.getState().prevStep();
    expect(useOptimizerStore.getState().step).toBe(2);
  });

  it('prevStep floors at step 1', () => {
    useOptimizerStore.getState().setStep(1);
    useOptimizerStore.getState().prevStep();
    expect(useOptimizerStore.getState().step).toBe(1);
  });

  it('updateForm merges data incrementally', () => {
    useOptimizerStore.getState().updateForm({ livestock_type: 'cattle_beef' });
    useOptimizerStore.getState().updateForm({ herd_size: 50 });
    const { formData } = useOptimizerStore.getState();
    expect(formData.livestock_type).toBe('cattle_beef');
    expect(formData.herd_size).toBe(50);
  });

  it('updateForm overwrites existing keys', () => {
    useOptimizerStore.getState().updateForm({ livestock_type: 'cattle_beef' });
    useOptimizerStore.getState().updateForm({ livestock_type: 'poultry_broiler' });
    expect(useOptimizerStore.getState().formData.livestock_type).toBe('poultry_broiler');
  });

  it('setSubmittedRequestId stores the ID', () => {
    useOptimizerStore.getState().setSubmittedRequestId('req-abc-123');
    expect(useOptimizerStore.getState().submittedRequestId).toBe('req-abc-123');
  });

  it('setSubmitting toggles isSubmitting', () => {
    useOptimizerStore.getState().setSubmitting(true);
    expect(useOptimizerStore.getState().isSubmitting).toBe(true);
    useOptimizerStore.getState().setSubmitting(false);
    expect(useOptimizerStore.getState().isSubmitting).toBe(false);
  });

  it('reset clears all state', () => {
    const store = useOptimizerStore.getState();
    store.setStep(4);
    store.updateForm({ livestock_type: 'swine', herd_size: 200 });
    store.setSubmittedRequestId('req-xyz');
    store.setSubmitting(true);

    store.reset();

    const state = useOptimizerStore.getState();
    expect(state.step).toBe(1);
    expect(state.formData).toEqual({});
    expect(state.submittedRequestId).toBeNull();
    expect(state.isSubmitting).toBe(false);
  });
});
