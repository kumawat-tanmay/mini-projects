import { apiFetch } from '@/utils/api';

export interface FocusMix {
  rain: number;
  cafe: number;
  noise: number;
  keyboard: number;
}

export const fetchFocusMix = async (): Promise<FocusMix> => {
  return apiFetch('/focus');
};

export const updateFocusMix = async (mix: Partial<FocusMix>): Promise<FocusMix> => {
  return apiFetch('/focus', {
    method: 'PATCH',
    body: JSON.stringify(mix),
  });
};
