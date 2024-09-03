import { Controller, Post, Get, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';


@Controller('csv')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  async clean() {
    const tempFilePath = path.join(__dirname, 'uploaded.csv');
    const processedFilePath = path.join(__dirname, 'processed.csv');

    forceDelete(tempFilePath);
    forceDelete(processedFilePath);
  }


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
      res.header('Content-Transfer-Encoding', 'binary')

      res.sendFile(csvFilePath, {}, async (err) => {
        if (err) {
          console.error('Erro ao enviar o arquivo:', err);
          res.status(500).send('Erro ao processar o arquivo.');
        }
        cleanUpFile(csvFilePath);

      });

    } catch (error) {

      console.error('Erro no processamento:', error.message);

      res.status(500).send('Erro ao processar o arquivo.');

      cleanUpFile(path.join(__dirname, 'uploaded.csv'));

    } finally {

      cleanUpFile(path.join(__dirname, 'uploaded.csv'));
    }
  }
}

function cleanUpFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    try {
      const fileDescriptor = fs.openSync(filePath, 'r');
      fs.closeSync(fileDescriptor);
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Erro ao tentar excluir o arquivo ${filePath}:`, error);
    }
  }
}

function forceDelete(filePath: string) {
  const deleteCommand = process.platform === 'win32' ? `del /f ${filePath}` : `rm -f ${filePath}`;

  exec(deleteCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao tentar forçar a exclusão do arquivo: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erro: ${stderr}`);
    } else {
      console.log(`Arquivo ${filePath} excluído com sucesso.`);
    }
  });
}