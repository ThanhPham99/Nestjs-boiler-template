import { Params } from 'nestjs-pino';

export function getLoggerConfig(): Params {
  return {
    pinoHttp: {
      transport: {
        targets: [
          {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          },
          {
            target: 'pino-roll',
            options: {
              file: './logs/app.log',
              frequency: 'hourly',
              dateFormat: 'yyyy-MM-dd-HH',
              mkdir: true,
            },
          },
        ],
      },
      redact: [
        'req.headers',
        'res.headers',
        'req.body.password',
        'req.body.newPassword',
      ],
      customProps: (_req, res) => {
        const response = res as {
          locals?: {
            status?: string;
          };
        };

        return {
          error_code: response.locals?.status,
        };
      },
    },
  };
}
