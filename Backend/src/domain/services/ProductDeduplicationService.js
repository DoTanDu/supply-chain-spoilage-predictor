// src/domain/services/ProductDeduplicationService.js
const Product = require('../entities/Product');

class ProductDeduplicationService {
  /**
   * Tính toán độ tương đồng giữa 2 chuỗi (Levenshtein Distance Similarity %)
   */
  static calculateSimilarity(str1, str2) {
    const s1 = Product.normalize(str1);
    const s2 = Product.normalize(str2);

    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return (maxLen - distance) / maxLen;
  }

  /**
   * Kiểm tra sản phẩm mới có bị trùng lặp với danh sách sản phẩm hiện có không.
   * Ngưỡng cảnh báo độ tương đồng: 85% (0.85).
   */
  static checkDuplicate(newProductData, existingProducts, threshold = 0.85) {
    const targetSku = (newProductData.sku || '').trim().toUpperCase();
    const targetNormalizedName = Product.normalize(newProductData.name);

    for (const p of existingProducts) {
      // 1. Trùng chính xác mã SKU
      if (p.sku && p.sku.toUpperCase() === targetSku) {
        return {
          isDuplicate: true,
          reason: `Trùng mã SKU [${targetSku}] với sản phẩm hiện có: "${p.name}".`,
          matchedProduct: p,
          similarity: 1.0
        };
      }

      // 2. Trùng tên chuẩn hóa
      const existingNormalized = p.normalizedName || Product.normalize(p.name);
      if (existingNormalized === targetNormalizedName) {
        return {
          isDuplicate: true,
          reason: `Trùng tên sản phẩm với: "${p.name}".`,
          matchedProduct: p,
          similarity: 1.0
        };
      }

      // 3. Trùng độ tương đồng cao (>= 85%)
      const similarity = this.calculateSimilarity(targetNormalizedName, existingNormalized);
      if (similarity >= threshold) {
        return {
          isDuplicate: true,
          reason: `Tên sản phẩm mới tương đồng ${(similarity * 100).toFixed(0)}% với sản phẩm có sẵn: "${p.name}". Vui lòng kiểm tra lại để tránh phân tán dữ liệu lô hàng.`,
          matchedProduct: p,
          similarity: Number(similarity.toFixed(2))
        };
      }
    }

    return { isDuplicate: false, similarity: 0 };
  }
}

module.exports = ProductDeduplicationService;
