export interface ServiceConfiguration {
    boyarLegacyBootstrap: string;
    pollIntervalSeconds: number;
    EthereumNetwork: EthereumNetwork;
}

export type EthereumNetwork = 'ganache' | 'mainnet' | 'ropsten';

export function isLegalServiceConfiguration(c: Partial<ServiceConfiguration>): c is ServiceConfiguration {
    return (
        !!c &&
        typeof c.boyarLegacyBootstrap === 'string' &&
        typeof c.pollIntervalSeconds == 'number' &&
        !Number.isNaN(c.pollIntervalSeconds) &&
        typeof c.EthereumNetwork == 'string' &&
        ['ganache', 'mainnet', 'ropsten'].includes(c.EthereumNetwork)
    );
}

export type DockerConfig<I extends string = string> = {
    ContainerNamePrefix?: string;
    Image: I;
    Tag: string;
    Pull?: boolean;
    Resources?: {
        Limits?: {
            Memory?: number;
            CPUs?: number;
        };
        Reservations?: {
            Memory?: number;
            CPUs?: number;
        };
    };
};

export type LegacyBoyarBootstrapInput = {
    network?: Array<unknown>;
    orchestrator: {
        [name: string]: string;
    };
    chains: Array<ChainConfiguration>;
    services: { [name: string]: unknown };
};

export type ChainConfiguration = {
    Id: string | number;
    InternalPort: number; // for gossip, identical for all vchains
    ExternalPort: number; // for gossip, different for all vchains
    InternalHttpPort: number; // identical for all vchains
    DockerConfig: DockerConfig;
    Config: {
        ManagementConfigUrl: string; //'http://1.1.1.1/vchains/42/management';
        SignerUrl: string; //'http://1.1.1.1/signer';
        'ethereum-endpoint': string; //'http://localhost:8545'; // eventually rename to EthereumEndpoint
    };
};

export interface GenericNodeService {
    InternalPort: number;
    ExternalPort: number;
    DockerConfig: DockerConfig;
    Config: object;
}
export interface ManagementNodeService extends GenericNodeService {
    DockerConfig: DockerConfig<'orbsnetwork/management-service'>;
    Config: ServiceConfiguration;
}

export type BoyarConfigurationOutput = {
    network: LegacyBoyarBootstrapInput['network'];
    orchestrator: {
        [name: string]: string | object;
        DynamicManagementConfig: {
            Url: string;
            ReadInterval: string;
            ResetTimeout: string;
        };
    };
    chains: Array<ChainConfiguration>;
    services: {
        [name: string]: GenericNodeService;
        'management-service': ManagementNodeService;
    };
};
