export interface Agent {
  id: string;
  name: string;
  version: string;
  description: string;
  authors: string[];
  license: string;
  icon?: string;
  repository?: string;
  distribution: {
    npx?: { package: string; args?: string[] };
    binary?: Record<string, { archive: string; cmd: string }>;
  };
}
