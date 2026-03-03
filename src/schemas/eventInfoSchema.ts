import { z } from 'zod';

import { GetAttributeInfoSchema } from './attributeInfoSchema';

export const GetEventInfoSchema = z.object({
  id: z.number(),
  name: z.string(),
  attributes_info: z.array(GetAttributeInfoSchema),
});
