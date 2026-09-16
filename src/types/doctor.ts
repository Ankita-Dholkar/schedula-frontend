export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  availability: string;
  description: string;
  availableTime: string;
  image: string;
  /** Primary clinic where in-person appointments are conducted. */
  clinic?: {
    name: string;
    address?: string;
  };
};