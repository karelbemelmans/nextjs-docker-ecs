ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY .next/standalone ./
COPY .next/static ./.next/static
RUN chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
