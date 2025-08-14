import { Injectable, Scope } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosResponse } from 'axios'
import { validate } from 'class-validator'

import { WithLogger } from '../../classes/with-logger'
import { LogMethod, PrivateLogMethod, ServiceLogMethod } from '../../decorators'
import { AppConfigTypes } from '../../types'
import {
  axiosCallWrapper,
  axiosResponseValidation,
  axiosRetryCall,
  getValidationMessageFromErrorArray,
} from '../../utils'
import { ApiUrlConstructorService } from '../api-url-constructor'

import {
  AccountDto,
  ActivityCreateDto,
  ActivityDto,
  CreateAccountDto,
  MarketDataDto,
  MarketDataUpdateRecordDto,
  MarketPriceRecordDto,
  PlatformDto,
  PlatformBaseDto,
  ProfileDataDto,
  ResponseTagDto,
  TagBaseDto,
} from './ghostfolio-connector.dto'
import {
  AccountResponseDto,
  AccountsResponseDto,
  AuthTokenResponseDto,
  CreateOrderResponseDto,
  CreateProfileResponseDto,
  MarketDataForSymbolResponseDto,
  MarketDataResponseDto,
  OrderResponseDto,
  ProfileDataResponseDto,
  UserResponseDto,
} from './ghostfolio-connector.responses.dto'
import { getAxiosBaseSettings } from './utils'

@Injectable({ scope: Scope.REQUEST })
export class GhostfolioConnectorService extends WithLogger {
  constructor(
    private readonly configService: ConfigService<AppConfigTypes>,
    private readonly apiUrlConstructor: ApiUrlConstructorService,
  ) {
    super(GhostfolioConnectorService.name)
  }

  public authToken: string | undefined = undefined

  /**
   * @returns Security tocken from env.
   */
  @PrivateLogMethod()
  private getSecurityToken(): string {
    const securityToken = this.configService.get<string>('GHOSTFOLIO_SECURITY_TOKEN')

    if (securityToken === undefined || securityToken?.length === 0) {
      throw new Error('No ghostfolio security token provided during retrieving ghostfolio auth token.')
    }

    return securityToken
  }

  /**
   * @returns Authentication token, that should be used as bearer token
   * in Authorization header.
   */
  @PrivateLogMethod()
  private async getAuthToken(): Promise<string> {
    const url = this.apiUrlConstructor.getGhostfolioAuthPath()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<AuthTokenResponseDto>>(
        () =>
          axios.post<AuthTokenResponseDto>(
            url,
            { accessToken: this.getSecurityToken() },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              ...getAxiosBaseSettings(),
            },
          ),
        300_000,
        this.logger,
        3,
      )

      this.authToken = response.data.authToken

      return response.data.authToken
    }, 'getAuthToken')
  }

  /**
   * Clear authentication tocken from class.
   */
  @LogMethod()
  public clearToken() {
    this.authToken = undefined
  }

  /**
   * @returns Return headers for Ghostfolio requests.
   */
  public async getHeaders() {
    const authToken = await this.getAuthToken()

    return {
      Authorization: `Bearer ${authToken}`,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    }
  }

  /**
   * Creates profile for provided asset in Ghostfolio.
   * @param symbol Asset identification symbol.
   * @returns Created asset.
   */
  @ServiceLogMethod()
  public async createProfileDataForSymbol(symbol: string): Promise<CreateProfileResponseDto> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioManualProfileDataUrl(symbol)

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<CreateProfileResponseDto>>(
        () =>
          axios.post<CreateProfileResponseDto>(url, undefined, {
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data
    }, 'createProfileDataForSymbol')
  }

  /**
   * Update profile for asset in Ghostfolio.
   * @param profileData Profile to be updated.
   * @param symbol Target asset symbol.
   * @returns Updated profile data.
   */
  @ServiceLogMethod()
  public async updateProfileDataForSymbol(
    profileData: ProfileDataDto,
    symbol: string,
  ): Promise<ProfileDataResponseDto> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioManualProfileDataUrl(symbol)

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<ProfileDataResponseDto>>(
        () =>
          axios.patch<ProfileDataResponseDto>(url, profileData, {
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      if (typeof response.data !== 'string') {
        await axiosResponseValidation(response)
      }

      return response.data
    }, 'updateProfileDataForSymbol')
  }

  /**
   * Return profile for provided asset symbol.
   * @param symbol Target asset symbol.
   * @returns Profile for asset symbol.
   */
  @ServiceLogMethod()
  public async getProfileDataForSymbol(symbol: string): Promise<MarketDataDto | undefined> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioAllAdminMarketDataUrl()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<MarketDataResponseDto>>(
        () =>
          axios.get<MarketDataResponseDto>(url, {
            headers,
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      const foundMarketData = response.data.marketData.find((marketData) => marketData.symbol === symbol)

      if (foundMarketData) {
        await axiosResponseValidation(response)
      }

      return foundMarketData
    }, 'getProfileDataForSymbol')
  }

  /**
   * @returns All manual profiles, that are saved in Ghostfolio.
   */
  @ServiceLogMethod()
  public async getAllManualProfileData(): Promise<MarketDataDto[]> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioAllAdminMarketDataUrl()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<MarketDataResponseDto>>(
        () =>
          axios.get<MarketDataResponseDto>(url, {
            headers,
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data.marketData
    }, 'getAllManualProfileData')
  }

  /**
   * Get all manual profiles and market data for provided asset symbol.
   * @param symbol Target asset symbol.
   * @returns All manual profiles and market data.
   */
  @ServiceLogMethod()
  public async getManualMarketDataForSymbol(symbol: string): Promise<MarketDataForSymbolResponseDto> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioNonAdminManualMarketDataUrl(symbol)

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<MarketDataForSymbolResponseDto>>(
        () =>
          axios.get<MarketDataForSymbolResponseDto>(url, {
            headers,
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)
      return response.data
    }, 'getManualMarketDataForSymbol')
  }

  /**
   * Create or update market data for provided symbol.
   * @param symbol Target symbol.
   * @param marketData Market data to be updated.
   * @returns Updated market data.
   */
  @ServiceLogMethod()
  public async setMarketDataForSymbol(
    symbol: string,
    marketData: MarketPriceRecordDto[],
  ): Promise<MarketDataUpdateRecordDto[]> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioNonAdminManualMarketDataUrl(symbol)
    const body = { marketData }

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<MarketDataUpdateRecordDto[]>>(
        () =>
          axios.post<MarketDataUpdateRecordDto[]>(url, body, {
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      return response.data
    }, 'setMarketDataForSymbol')
  }

  /**
   * Delete manual profile from Ghostfolio.
   * @param symbol Target symbol.
   */
  @ServiceLogMethod()
  public async deleteManualProfileData(symbol: string): Promise<void> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioManualMarketDataUrl(symbol)

    return axiosCallWrapper(async () => {
      await axiosRetryCall<AxiosResponse<void>>(
        () => axios.delete(url, { headers, ...getAxiosBaseSettings() }),
        300_000,
        this.logger,
        3,
      )
    }, 'deleteManualProfileData')
  }

  /**
   * @returns All account in ghostfolio.
   */
  @ServiceLogMethod()
  public async getAccounts(): Promise<AccountDto[]> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioAccountsUrl()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<AccountsResponseDto>>(
        () =>
          axios.get<AccountsResponseDto>(url, {
            headers,
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data.accounts
    }, 'getAccounts')
  }

  /**
   * Return account with provided id.
   * @param accountId Target account id.
   * @returns Found account.
   */
  @ServiceLogMethod()
  public async getAccount(accountId: string): Promise<AccountResponseDto> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioAccountUrl(accountId)

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<AccountResponseDto>>(
        () =>
          axios.get<AccountResponseDto>(url, {
            headers,
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data
    }, 'getAccount')
  }

  /**
   * Create account based on provided account property.
   * @param account Account to be created.
   * @returns Created account.
   */
  @ServiceLogMethod()
  public async createAccount(account: CreateAccountDto): Promise<AccountResponseDto> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioAccountsUrl()

    const validationErrors = await validate(account)
    const validationMessage = getValidationMessageFromErrorArray(validationErrors)

    if (validationMessage) {
      throw new Error(validationMessage)
    }

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<AccountResponseDto>>(
        () =>
          axios.post<AccountResponseDto>(url, account, {
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            ...getAxiosBaseSettings(),
          }),
        30_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data
    }, 'createAccount')
  }

  /**
   * @returns Ghostfolio admin user.
   */
  @ServiceLogMethod()
  public async getUser(): Promise<UserResponseDto> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioUserUrl()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<UserResponseDto>>(
        () =>
          axios.get<UserResponseDto>(url, {
            headers,
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data
    }, 'getUser')
  }

  /**
   * @returns All ghostfolio orders.
   */
  @ServiceLogMethod()
  public async getOrders(): Promise<ActivityDto[]> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioOrdersUrl()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<OrderResponseDto>>(
        () =>
          axios.get<OrderResponseDto>(url, {
            headers,
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data.activities
    }, 'getOrders')
  }

  /**
   * Create order in ghostfolio based on activity record.
   * @param activity Order activity to be created.
   * @returns Created order.
   */
  @ServiceLogMethod()
  public async createOrder(activity: ActivityCreateDto): Promise<CreateOrderResponseDto> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioOrdersUrl()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<CreateOrderResponseDto>>(
        () =>
          axios.post<CreateOrderResponseDto>(url, activity, {
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data
    }, 'createOrder')
  }

  /**
   * @returns Ghostfolio platforms.
   */
  @ServiceLogMethod()
  public async getPlatforms(): Promise<PlatformDto[]> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioPlatformUrl()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<PlatformDto[]>>(
        () =>
          axios.get<PlatformDto[]>(url, {
            headers,
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data
    }, 'getPlatforms')
  }

  /**
   * @param platform Platform to be created.
   * @returns Created platform.
   */
  @ServiceLogMethod()
  public async createPlatform(platform: PlatformBaseDto): Promise<PlatformDto> {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioPlatformUrl()

    const validationErrors = await validate(platform)
    const validationMessage = getValidationMessageFromErrorArray(validationErrors)

    if (validationMessage) {
      throw new Error(validationMessage)
    }

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<PlatformDto>>(
        () =>
          axios.post<PlatformDto>(url, platform, {
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            ...getAxiosBaseSettings(),
          }),
        30_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data
    }, 'createPlatform')
  }

  /**
   * @returns All ghostfolio tags.
   */
  @ServiceLogMethod()
  public async getTags() {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioTagsUrl()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<ResponseTagDto[]>>(
        () =>
          axios.get<ResponseTagDto[]>(url, {
            headers,
            ...getAxiosBaseSettings(),
          }),
        300_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data
    }, 'getTags')
  }

  /**
   * Create tag based on tag parameter.
   * @param tag Tag to be created.
   * @returns Created tag.
   */
  @ServiceLogMethod()
  public async createTag(tag: TagBaseDto) {
    const headers = await this.getHeaders()
    const url = this.apiUrlConstructor.getGhostfolioTagsUrl()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<ResponseTagDto>>(
        () =>
          axios.post<ResponseTagDto>(url, tag, {
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            ...getAxiosBaseSettings(),
          }),
        30_000,
        this.logger,
        3,
      )

      await axiosResponseValidation(response)

      return response.data
    }, 'createTag')
  }
}
