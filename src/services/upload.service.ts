import { SUPABASE_BUCKET, SUPABASE_KEY, SUPABASE_URL } from "@config/env.config";
import { BadRequestException, Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

@Injectable()
export class UploadService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }

  async upload(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No files to upload');

    const fileExt = file.originalname.split('.').pop();
    const filename = `${randomUUID()}.${fileExt}`;

    const { data, error } = await this.supabase
                                  .storage
                                  .from(SUPABASE_BUCKET)
                                  .upload(filename, file.buffer, {
                                    contentType: file.mimetype,
                                    upsert: false
                                  });

    if (error) throw new BadRequestException(error.message);

    const { data: publicUrl } = this.supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filename);

    return {
      url: publicUrl.publicUrl
    };
  }
}