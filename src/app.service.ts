import { Injectable } from '@nestjs/common';
import * as fastcsv from 'fast-csv';
import * as csvWriter from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class AppService {
  async reduce(fileBuffer: Buffer): Promise<string> {

    const tempFilePath = path.join(__dirname, 'uploaded.csv'); 
    const processedFilePath = path.join(__dirname, 'processed.csv'); 

    fs.writeFileSync(tempFilePath, fileBuffer);

    const fieldRules: { [key: string]: number } = {
      bic: 5,
      inscricao: 50,
      engloba_bic: 20,
      distrito: 5,
      setor: 5,
      zona: 5,
      quadra: 6,
      lote: 10,
      unidade: 15,
      matricula_numero: 20,
      matricula_data: 10,
      matricula_quadra: 6,
      matricula_lote: 10,
      situacao_cadastro: 60,
      codigo_logradouro: 10,
      tipo_logradouro: 30,
      nome_logradouro: 200,
      numero_predial: 10,
      complemento: 100,
      codigo_bairro: 10,
      nome_bairro: 80,
      loteamento: 120,
      cep: 10,
      rua_correspondencia: 200,
      numero_correspondencia: 10,
      complemento_correspondencia: 100,
      bairro_correspondencia: 80,
      cep_correspondencia: 10,
      cidade_correspondencia: 100,
      codigo_proprietario: 20,
      nome_proprietario: 180,
      codigo_responsavel: 20,
      nome_responsavel: 180,
      documento: 50,
      testada_principal: 10,
      area_terreno: 10,
      calcada: 5,
      pavimentos: 10,
      muro: 5,
      localizacao: 60,
      formato: 60,
      topologia: 60,
      pedologia: 60,
      lei_uso_solo: 30,
      uso: 60,
      patrimonio: 60,
      ocupacao: 60,
      valor_m2: 20,
      vvt: 20,
      vvi: 20,
      aliquota: 10,
      iptu: 10,
    };

    const results: Record<string, string>[] = []; 

    return new Promise<string>((resolve, reject) => {
      fs.createReadStream(tempFilePath)
        .pipe(
          fastcsv.parse({ headers: true, delimiter: '|', trim: true }) 
        )
        .on('data', (row: Record<string, string>) => {
          const processedRow: Record<string, string> = {};
          for (const [field, value] of Object.entries(row)) {
            
            processedRow[field] = value.length > (fieldRules[field] || value.length)
              ? value.slice(0, fieldRules[field])
              : value;
          }
          results.push(processedRow);
        })
        .on('end', async () => {
          const csvWrite = csvWriter.createObjectCsvWriter({
            path: processedFilePath,
            header: Object.keys(results[0]).map((field) => ({ id: field, title: field })),
            fieldDelimiter:';'
          });

          await csvWrite.writeRecords(results);

        
          fs.unlinkSync(tempFilePath);

          resolve(processedFilePath);
        })
        .on('error', (error) => {
          fs.unlinkSync(tempFilePath); 
          reject(error);
        });
    });
  }
}
