import { PrismaClient } from '@prisma/client';
import { enhance } from '@zenstackhq/runtime';
import { ZenStackMiddleware } from '@zenstackhq/server/express';
import express from 'express';
import { RestApiHandler } from '@zenstackhq/server/api';

const app = express();

app.use(express.json());
const prisma = new PrismaClient();
app.use(
    '/api',
    ZenStackMiddleware({
        getPrisma: (req) =>
            enhance(prisma, {
                user: { id: req.header('X-USER-ID')! },
            }),
        handler: RestApiHandler({ endpoint: 'http://localhost:3000/api' }),
    })
);

app.use((req, res, next) => {
    const userId = req.header('X-USER-ID');
    if (!userId) {
        res.status(403).json({ error: 'unauthorized' });
    } else {
        next();
    }
});

app.listen(3000, () =>
    console.log(`
🚀 Server ready at: http://localhost:3000`)
);
