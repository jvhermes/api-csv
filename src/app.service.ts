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

    try {
      fs.writeFileSync(tempFilePath, fileBuffer);

      const fieldRules: { [key: string]: number } = {
        bic: 20,
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
        area_edificada: 10,
        area_irregular: 10,
        posicao: 60,
        padrao_construtivo: 60,
        idade_aparente: 60,
        estado_conservacao: 60,
        vve: 20,
        alvara: 20,
        data_alvara: 10,
        habite_se: 20,
        data_habite_se: 10,
      };

      const decimalFields = ['testada_principal', 'area_terreno', 'valor_m2', 'vvi', 'vvt','iptu','area_edificada','vve'];

      const results: Record<string, string>[] = [];

      return new Promise<string>((resolve, reject) => {
        fs.createReadStream(tempFilePath)
          .pipe(
            fastcsv.parse({ headers: true, delimiter: ';', trim: true })
          )
          .on('data', (row: Record<string, string>) => {
            try {
              const processedRow: Record<string, string> = {};
              for (const [field, value] of Object.entries(row)) {

                let processedValue = value;

                if (value.length > (fieldRules[field] || value.length)) {
                  processedValue = value.slice(0, fieldRules[field]);
                }

                if (decimalFields.includes(field)) {
           
                  const [integerPart, decimalPart] = processedValue.split('.');
                  if (decimalPart && decimalPart.length > 2) {
                    processedValue = `${integerPart}.${decimalPart.slice(0, 2)}`;
                  }
                }

                processedRow[field] = processedValue;

              }
              results.push(processedRow);
            } catch (dataProcessingError) {

              reject(dataProcessingError);
            }
          })
          .on('end', async () => {
            try {
              const csvWrite = csvWriter.createObjectCsvWriter({
                path: processedFilePath,
                header: Object.keys(results[0]).map((field) => ({ id: field, title: field })),
                fieldDelimiter: ';',
              });

              await csvWrite.writeRecords(results);
              resolve(processedFilePath);
            } catch (writeError) {

              reject(writeError);
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    } catch (initialError) {
      throw initialError;
    }
  }
}
