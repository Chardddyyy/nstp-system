/**
 * Standardized API Response Utilities
 * Provides consistent formatting across all API endpoints
 */

class ApiResponse {
  /**
   * Success response with payload
   */
  static success(res, data = null, message = 'Operation successful', statusCode = 200, meta = null) {
    const response = {
      success: true,
      message,
      data
    };
    if (meta) {
      response.meta = meta;
    }
    return res.status(statusCode).json(response);
  }

  /**
   * Paginated list response
   */
  static paginated(res, items = [], page = 1, limit = 20, total = 0, message = 'Data retrieved successfully') {
    const totalPages = Math.ceil(total / limit) || 1;
    return res.status(200).json({
      success: true,
      message,
      data: items,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  }

  /**
   * Created resource response (201)
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Standard error response
   */
  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message
    };
    if (errors) {
      response.errors = errors;
    }
    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;
