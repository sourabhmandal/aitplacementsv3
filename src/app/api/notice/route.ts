import { TNotificationResponse } from "@/components/utils/api.utils";
import { initializeDb } from "@/server";
import {
  attachments,
  notices,
  TInsertAttachmentSchema,
} from "@/server/model/notice";
import { S3Instance } from "@/server/S3";
import { count, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { GetNoticeResponse } from "./[id]/route";

async function createNoticeHandler(request: Request) {
  try {
    const reqData = await request.json();
    const validatedFields = CreateNoticeRequest.safeParse(reqData);
    if (!validatedFields.success) {
      console.error(
        "Invalid fields while validating request:",
        validatedFields.error.message
      );
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid fields",
        } as TNotificationResponse,
        {
          status: 400,
        }
      );
    }

    // create notice in db
    const db = await initializeDb();
    const savedNotice = await db
      .insert(notices)
      .values({
        title: validatedFields.data.title,
        isPublished: validatedFields.data.isPublished,
        content: validatedFields.data.content,
        contentHtml: validatedFields.data.contentHtml,
        adminEmail: validatedFields.data.adminEmail,
      })
      .returning();

    await Promise.all(
      validatedFields.data.files.map(async (file) => {
        const source = `temp-uploads/${file}`;
        const destination = `${
          savedNotice.length > 0 ? savedNotice[0].id : "temp-uploads"
        }/${file}`;
        await S3Instance.moveS3File(source, destination);
        return db
          .insert(attachments)
          .values({
            noticeid:
              savedNotice.length > 0 ? savedNotice[0].id : "temp-uploads",
            filename: file,
            filepath: source,
            filetype: file.split(".").pop() ?? "text",
          } as TInsertAttachmentSchema)
          .onConflictDoUpdate({
            target: [attachments.filepath],
            set: {
              filepath: destination,
              noticeid:
                savedNotice.length > 0 ? savedNotice[0].id : "temp-uploads",
            } as TInsertAttachmentSchema,
          });
      })
    );

    return NextResponse.json(
      {
        status: "success",
        message: "notice created successfully",
      } as TNotificationResponse,
      {
        status: 200,
      }
    );
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      {
        status: "error",
        message: "notice created unsuccessful due to server error",
      } as TNotificationResponse,
      {
        status: 500,
      }
    );
  }
}

async function getAllNoticeHandler(request: Request) {
  // page=2&rows=10
  // parse query params using nextjs 14
  const { searchParams } = new URL(request.url);
  const page = ~~(searchParams.get("page") ?? "1"); // Example: /api/notices?id=123
  const rows = 10;

  if (page < 1) {
    return NextResponse.json(
      {
        status: "error",
        message: "wrong page number or rows number",
      } as TNotificationResponse,
      {
        status: 500,
      }
    );
  }
  try {
    const db = await initializeDb();
    const countData = await db
      .select({ count: count(notices.id) })
      .from(notices);

    if (page > Math.ceil(countData[0].count / rows)) {
      return NextResponse.json(
        {
          status: "error",
          message: "page number exceeds total pages, please try again",
        } as TNotificationResponse,
        {
          status: 500,
        }
      );
    }
    const data = await db
      .select()
      .from(notices)
      .offset((page - 1) * rows)
      .limit(rows)
      .orderBy(desc(notices.createdAt));

    return NextResponse.json(
      {
        notices: data,
        totalCount: countData[0].count,
      } as TGetAllNoticeResponse,
      {
        status: 200,
      }
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      {
        status: "error",
        message: `unable to get notices due to server error`,
      } as TNotificationResponse,
      {
        status: 500,
      }
    );
  }
}

export const CreateNoticeRequest = z.object({
  title: z.string(),
  content: z.string(),
  contentHtml: z.string().optional(),
  isPublished: z.boolean(),
  adminEmail: z.string().email(),
  files: z.array(z.string()).default([]),
});
export type TCreateNoticeRequest = z.infer<typeof CreateNoticeRequest>;

export const GetAllNoticeResponse = z.object({
  notices: z.array(GetNoticeResponse),
  totalCount: z.number().default(0),
});
export type TGetAllNoticeResponse = z.infer<typeof GetAllNoticeResponse>;

export { getAllNoticeHandler as GET, createNoticeHandler as POST };
