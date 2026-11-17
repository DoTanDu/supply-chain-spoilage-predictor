// src/presentation/controllers/SalesController.js
class SalesController {
  constructor({ 
    processFefoSaleUseCase, 
    getSalesHistoryUseCase, 
    getSaleReceiptUseCase,
    validateAndImportPosCsvUseCase 
  }) {
    this.processFefoSaleUseCase = processFefoSaleUseCase;
    this.getSalesHistoryUseCase = getSalesHistoryUseCase;
    this.getSaleReceiptUseCase = getSaleReceiptUseCase;
    this.validateAndImportPosCsvUseCase = validateAndImportPosCsvUseCase;
  }

  async processSale(req, res, next) {
    try {
      const { items, weather, isHoliday } = req.body;
      const cashierId = req.user ? req.user.id : (req.body.cashierId || 3);
      const cashierName = req.user ? req.user.fullName : (req.body.cashierName || 'Thu ngân quầy POS');

      const weatherCondition = typeof weather === 'object' && weather !== null
        ? (weather.condition || 'NORMAL')
        : (weather || 'NORMAL');
      const holidayFlag = typeof weather === 'object' && weather !== null
        ? Boolean(weather.isHoliday ?? isHoliday)
        : Boolean(isHoliday);

      const result = await this.processFefoSaleUseCase.execute({
        items,
        weather: weatherCondition,
        isHoliday: holidayFlag,
        cashierId,
        cashierName
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const limit = Number(req.query.limit || 50);
      const result = await this.getSalesHistoryUseCase.execute({ limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getReceipt(req, res, next) {
    try {
      const { txnCode } = req.params;
      const result = await this.getSaleReceiptUseCase.execute({ transactionCode: txnCode });
      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // EXCEL / CSV POS IMPORT & VALIDATION MODULE (Mục 07 & Phụ lục A1 PDF)
  // ==========================================
  async validateCsv(req, res, next) {
    try {
      const { csvContent } = req.body;
      if (!this.validateAndImportPosCsvUseCase) {
        throw new Error('ValidateAndImportPosCsvUseCase chưa được khởi tạo!');
      }
      const result = await this.validateAndImportPosCsvUseCase.validate(csvContent);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async importCsv(req, res, next) {
    try {
      const { csvContent, validatedData, storeId } = req.body;
      const cashierId = req.user ? req.user.id : 3;
      if (!this.validateAndImportPosCsvUseCase) {
        throw new Error('ValidateAndImportPosCsvUseCase chưa được khởi tạo!');
      }
      const result = await this.validateAndImportPosCsvUseCase.commitImport({
        csvContent,
        validatedData,
        cashierId,
        storeId: storeId || 1
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getCsvTemplate(req, res, next) {
    try {
      if (!this.validateAndImportPosCsvUseCase) {
        throw new Error('ValidateAndImportPosCsvUseCase chưa được khởi tạo!');
      }
      const csvStr = this.validateAndImportPosCsvUseCase.getStandardTemplateCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="sample_pos_transactions.csv"');
      res.send('\uFEFF' + csvStr); // Prepend UTF-8 BOM so Excel opens it with Vietnamese accents perfectly
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SalesController;
