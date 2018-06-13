import { object, string } from 'yup';

export const schema = object()
  .noUnknown()
  .shape({
    type: string().oneOf(['DebugInfo']),
  });

export default async function DebugInfo() {
  return {
    isHTTPS: false,
  };
}
