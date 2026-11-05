// src/application/use-cases/sales/GetSaleReceiptUseCase.js
/**
 * Use Case: Truy vấn Chi tiết Hóa đơn Bán lẻ POS & In lại Hóa đơn (Mục 22.6 SSOT)
 * Endpoint: GET /api/sales/receipt/:txnCode
 */
class GetSaleReceiptUseCase {
  constructor({ saleRepository, storeProfileRepository }) {
    this.saleRepository = saleRepository;
    this.storeProfileRepository = storeProfileRepository;
  }

  async execute({ transactionCode }) {
    if (!transactionCode) {
      return {
        success: false,
        statusCode: 400,
        message: 'Mã giao dịch (transactionCode) không được để trống.'
      };
    }

    const receipt = await this.saleRepository.getReceiptByTxnCode(transactionCode);
    if (!receipt) {
      return {
        success: false,
        statusCode: 404,
        message: `Không tìm thấy hóa đơn có mã [${transactionCode}].`
      };
    }

    let store = null;
    if (this.storeProfileRepository && typeof this.storeProfileRepository.getProfile === 'function') {
      try {
        store = await this.storeProfileRepository.getProfile();
      } catch (e) {
        store = null;
      }
    }

    return {
      success: true,
      data: {
        ...receipt,
        store: {
          storeCode: store ? store.storeCode : 'RETAIL-STORE-01',
          storeName: store ? store.storeName : 'Cửa hàng Bán lẻ Tiện lợi LHU Mart',
          address: store ? store.address : 'Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai',
          phone: store ? store.phone : '0251.3952.778'
        }
      }
    };
  }
}

module.exports = GetSaleReceiptUseCase;

