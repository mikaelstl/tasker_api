import { SUPABASE_BUCKET, SUPABASE_KEY, SUPABASE_URL } from "@config/env.config";
import { Injectable } from '@nestjs/common';
import { UploadRepository } from "@modules/upload/upload.repository";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { ValidationException } from 'src/common/errors/validation.exception';
import { InternalException } from 'src/common/errors/internal.exception';

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
    if (!file) throw new ValidationException('Nenhum arquivo foi enviado.');
    if (!file.mimetype.startsWith('image/')) {
      throw new ValidationException('Envie apenas arquivos de imagem.');
    }

    const fileExt = file.originalname.split('.').pop();
    const filename = `${randomUUID()}.${fileExt}`;

    const { data, error } = await this.supabase
                                  .storage
                                  .from(SUPABASE_BUCKET)
                                  .upload(filename, file.buffer, {
                                    contentType: file.mimetype,
                                    upsert: false
                                  });

    if (error) {
      throw new InternalException('Falha na comunicação com o serviço de imagens.', error);
    }

    const { data: publicUrl } = this.supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filename);

    const result = this.repository.create({
      filename: filename,
      url: publicUrl.publicUrl,
      userkey: user,
    })

    return result;
  }
}
