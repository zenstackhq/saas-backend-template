import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
    // Prisma Team
    {
        id: "robin@prisma.io",
        name: "Robin",
        email: "robin@prisma.io",
        orgs: {
            create: [
                {
                    id: "prisma",
                    name: "prisma",
                },
            ],
        },
        groups: {
            create: [
                {
                    id: "community",
                    name: "community",
                    orgId: "prisma",
                },
            ],
        },
        posts: {
            create: [
                {
                    id: "slack",
                    title: "Join the Prisma Slack",
                    content: "https://slack.prisma.io",
                    orgId: "prisma",
                },
            ],
        },
    },
    {
        id: "bryan@prisma.io",
        name: "Bryan",
        email: "bryan@prisma.io",
        orgs: {
            connect: {
                id: "prisma",
            },
        },
        posts: {
            create: [
                {
                    id: "discord",
                    title: "Join the Prisma Discord",
                    content: "https://discord.gg/jS3XY7vp46",
                    orgId: "prisma",
                    groups: {
                        connect: {
                            id: "community",
                        },
                    },
                },
            ],
        },
    },
    {
        id: "gavin@prisma.io",
        name: "Gavin",
        email: "gavin@prisma.io",
        orgs: {
            connect: {
                id: "prisma",
            },
        },
        posts: {
            create: [
                {
                    id: "twitter",
                    title: "Follow Prisma on Twitter",
                    content: "https://twitter.com/prisma",
                    isPublic: true,
                    orgId: "prisma",
                },
            ],
        },
    },
    // ZenStack Team
    {
        id: "js@zenstack.dev",
        name: "JS",
        email: "js@zenstack.dev",
        orgs: {
            create: [
                {
                    id: "zenstack",
                    name: "zenstack",
                },
            ],
        },
    },
];

async function main() {
    console.log(`Start seeding ...`);
    for (const u of userData) {
        const user = await prisma.user.create({
            data: u,
        });
        console.log(`Created user with id: ${user.id}`);
    }
    console.log(`Seeding finished.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
