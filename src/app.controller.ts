import { Controller, Post, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';


@Controller('csv')
export class AppController {
  constructor(private readonly appService: AppService) { }


  @UseInterceptors(FileInterceptor('file'))
  @Post()
  async reduce(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {

      const csvFilePath = await this.appService.reduce(file.buffer);

      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename="processed.csv"');
      res.header('Content-Transfer-Encoding','binary')
      res.sendFile(csvFilePath, {}, (err) => {
        if (err) {
          console.error('Erro ao enviar o arquivo:', err);
        }
      
        fs.unlinkSync(csvFilePath);
      });
    } catch (error) {
      res.status(500).send('Erro ao processar o arquivo.');
    }
  }
}
