import { RuleConfigSeverity, type UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [RuleConfigSeverity.Disabled, 'always', []],
  },
};

export default config;
