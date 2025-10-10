import { apiClient } from '../utils/apiClient';

export class NewsPageService {
  private baseURL = '/api/newspage';

  // 정적 메서드로 getData 제공
  static async getData(params?: any): Promise<any> {
    const service = new NewsPageService();
    return service.getList(params);
  }


  async getList(params?: any): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseURL}/list`);
      return response.data;
    } catch (error) {
      console.error('getList API Error:', error);
      throw error;
    }
  }
  async getDetail(id: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseURL}/:id`);
      return response.data;
    } catch (error) {
      console.error('getDetail API Error:', error);
      throw error;
    }
  }
  async createItem(data: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseURL}/create`);
      return response.data;
    } catch (error) {
      console.error('createItem API Error:', error);
      throw error;
    }
  }
  async updateItem(id: string, data: any): Promise<any> {
    try {
      const response = await apiClient.put(`${this.baseURL}/:id`);
      return response.data;
    } catch (error) {
      console.error('updateItem API Error:', error);
      throw error;
    }
  }
  async deleteItem(id: string): Promise<any> {
    try {
      const response = await apiClient.delete(`${this.baseURL}/:id`);
      return response.data;
    } catch (error) {
      console.error('deleteItem API Error:', error);
      throw error;
    }
  }

  // 공통 메서드
  async getData(params?: any): Promise<any> {
    return this.getList(params);
  }

  async getById(id: string): Promise<any> {
    return this.getDetail(id);
  }

  async create(data: any): Promise<any> {
    return this.createItem(data);
  }

  async update(id: string, data: any): Promise<any> {
    return this.updateItem(id, data);
  }

  async delete(id: string): Promise<any> {
    return this.deleteItem(id);
  }
}

export const newspageService = new NewsPageService();