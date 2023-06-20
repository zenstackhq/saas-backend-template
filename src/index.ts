import { PrismaClient } from "@prisma/client";
import { withPresets } from "@zenstackhq/runtime";
import { ZenStackMiddleware } from "@zenstackhq/server/express";
import express, { Request } from "express";
import RestApiHandler from "@zenstackhq/server/api/rest";

const app = express();

app.use(express.json());
const prisma = new PrismaClient();
app.use(
    "/api",
    ZenStackMiddleware({
        getPrisma: (req) =>
            withPresets(prisma, {
                user: { id: req.header("X-USER-ID") },
            }),
        handler: RestApiHandler({ endpoint: "http://localhost:3000/api" }),
    })
);

app.use((req, res, next) => {
    const userId = req.header("X-USER-ID");
    if (!userId) {
        res.status(403).json({ error: "unauthorized" });
    } else {
        next();
    }
});

app.listen(3000, () =>
    console.log(`
🚀 Server ready at: http://localhost:3000`)
);
