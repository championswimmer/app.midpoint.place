import axios, { type AxiosInstance } from 'axios';

// region DTOs - Based on OpenAPI #/definitions
// Basic Error Response
interface ErrorResponse {
  message: string;
  status: number;
}

// Group Enums
enum GroupType {
  Public = 'public',
  Protected = 'protected',
  Private = 'private'
}

enum GroupUserRole {
  Admin = 'admin',
  Member = 'member'
}

// Place Enum
enum PlaceType {
  Restaurant = 'restaurant',
  Bar = 'bar',
  Cafe = 'cafe',
  Park = 'park'
}

// Group DTOs
interface CreateGroupRequest {
  name: string;
  radius?: number;
  secret?: string;
  type?: GroupType;
}

interface GroupCreator {
  id: number;
  username: string;
}

interface GroupPlaceResponse {
  address: string;
  group_id: string;
  id: string;
  latitude: number;
  longitude: number;
  map_uri: string;
  name: string;
  place_id: string;
  rating: number;
  type: PlaceType;
}

interface GroupUserResponse {
  group_id: string;
  latitude: number;
  longitude: number;
  role: GroupUserRole;
  user_id: number;
}

interface GroupResponse {
  code: string;
  creator: GroupCreator;
  id: string;
  members: GroupUserResponse[];
  midpoint_latitude: number;
  midpoint_longitude: number;
  name: string;
  places: GroupPlaceResponse[];
  radius: number;
  type: GroupType;
}

interface UpdateGroupRequest {
  name?: string;
  radius?: number;
  secret?: string;
  type?: GroupType;
}

interface GroupUserJoinRequest {
  latitude: number;
  longitude: number;
}

// User DTOs
export interface CreateUserRequest {
  username?: string;
  password?: string;
}

interface Location {
  latitude: number;
  longitude: number;
}

export interface LoginUserRequest {
  username?: string;
  password?: string;
}

export interface UserResponse {
  id: number;
  location?: Location;
  token?: string;
  username?: string;
}

interface UserUpdateRequest {
  location?: Location;
}

// Waitlist DTOs
interface WaitlistSignupRequest {
  email: string;
}

interface WaitlistSignupResponse {
  message: string;
}
// endregion DTOs

const BASE_URL = 'https://api.midpoint.place/v1';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  public updateAuthToken(token: string) {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // User Endpoints
  public async registerUser(data: CreateUserRequest): Promise<UserResponse> {
    const response = await this.axiosInstance.post<UserResponse>('/users', data);
    return response.data;
  }

  public async loginUser(data: LoginUserRequest): Promise<UserResponse> {
    const response = await this.axiosInstance.post<UserResponse>('/users/login', data);
    if (response.data.token) {
      this.updateAuthToken(response.data.token);
    }
    return response.data;
  }

  public async updateUserLocation(userId: string, data: UserUpdateRequest): Promise<UserResponse> {
    const response = await this.axiosInstance.post<UserResponse>(`/users/${userId}`, data);
    return response.data;
  }

  // Group Endpoints
  public async listPublicGroups(self?: 'creator' | 'member'): Promise<GroupResponse[]> {
    const params: { self?: 'creator' | 'member' } = {};
    if (self) {
      params.self = self;
    }
    const response = await this.axiosInstance.get<GroupResponse[]>('/groups', { params });
    return response.data;
  }

  public async createGroup(data: CreateGroupRequest): Promise<GroupResponse> {
    const response = await this.axiosInstance.post<GroupResponse>('/groups', data);
    return response.data;
  }

  public async getGroup(groupIdOrCode: string, includeUsers?: boolean, includePlaces?: boolean): Promise<GroupResponse> {
    const params: { includeUsers?: boolean; includePlaces?: boolean } = {};
    if (includeUsers !== undefined) {
      params.includeUsers = includeUsers;
    }
    if (includePlaces !== undefined) {
      params.includePlaces = includePlaces;
    }
    const response = await this.axiosInstance.get<GroupResponse>(`/groups/${groupIdOrCode}`, { params });
    return response.data;
  }

  public async updateGroup(groupIdOrCode: string, data: UpdateGroupRequest): Promise<GroupResponse> {
    const response = await this.axiosInstance.patch<GroupResponse>(`/groups/${groupIdOrCode}`, data);
    return response.data;
  }

  public async joinGroup(groupIdOrCode: string, data: GroupUserJoinRequest): Promise<GroupUserResponse> {
    const response = await this.axiosInstance.put<GroupUserResponse>(`/groups/${groupIdOrCode}/join`, data);
    return response.data;
  }

  public async leaveGroup(groupIdOrCode: string): Promise<GroupUserResponse> {
    const response = await this.axiosInstance.delete<GroupUserResponse>(`/groups/${groupIdOrCode}/join`);
    return response.data;
  }

  // Waitlist Endpoints
  public async addToWaitlist(data: WaitlistSignupRequest): Promise<WaitlistSignupResponse> {
    const response = await this.axiosInstance.post<WaitlistSignupResponse>('/waitlist/signup', data);
    return response.data;
  }
}

// Export a singleton instance
const apiService = new ApiService();
export default apiService;
