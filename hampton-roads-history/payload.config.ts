import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";

import { Users } from "@/payload/collections/Users";
import { Categories } from "@/payload/collections/Categories";
import { Authors } from "@/payload/collections/Authors";
import { Articles } from "@/payload/collections/Articles";
import { Breaking } from "@/payload/collections/Breaking";
import { AdCreatives } from "@/payload/collections/AdCreatives";
import { Corrections } from "@/payload/collections/Corrections";

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  editor: lexicalEditor({}),
  admin: {
    user: "hr_cms_users",
  },
  collections: [
    Users,
    Categories,
    Authors,
    Articles,
    Breaking,
    AdCreatives,
    Corrections,
  ],
  typescript: {
    outputFile: "./payload-types.ts",
  },
});
