import { SUPABASE_BUCKET, SUPABASE_KEY, SUPABASE_URL } from "@config/env.config";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { UploadRepository } from "@modules/upload/upload.repository";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

@Injectable()
export class UploadService {
  private readonly supabase: SupabaseClient;
  
  constructor(
    private readonly repository: UploadRepository,
  ) {
    this.supabase = createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }

  async upload(file: Express.Multer.File, user: string) {
    if (!file) throw new HttpException('No files to upload', HttpStatus.BAD_REQUEST);
    if (!file.mimetype.startsWith('image/')) throw new HttpException('Only upload images.', HttpStatus.BAD_REQUEST);

    const fileExt = file.originalname.split('.').pop();
    const filename = `${randomUUID()}.${fileExt}`;

    const { data, error } = await this.supabase
                                  .storage
                                  .from(SUPABASE_BUCKET)
                                  .upload(filename, file.buffer, {
                                    contentType: file.mimetype,
                                    upsert: false
                                  });

    if (error) throw new HttpException(error.message, HttpStatus.BAD_REQUEST);

    const { data: publicUrl } = this.supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filename);

    const result = this.repository.create({
      filename: filename,
      url: publicUrl.publicUrl,
      userkey: user,
    })

    return result;
  }
}