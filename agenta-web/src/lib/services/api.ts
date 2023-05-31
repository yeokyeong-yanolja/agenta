import useSWR from 'swr';
import axios from 'axios';
import { parseOpenApiSchema } from '@/lib/helpers/openapi_parser';
import { Variant, Parameter } from '@/lib/Types';
/**
 * Raw interface for the parameters parsed from the openapi.json
 */

export const API_BASE_URL = "http://localhost";  // Replace this with your actual API base URL

const fetcher = (...args) => fetch(...args).then(res => res.json());

export async function fetchVariants(app: string): Promise<Variant[]> {
    const response = await axios.get(`${API_BASE_URL}/api/app_variant/list_variants/?app_name=${app}`);

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map((variant: Record<string, any>) => {
            let v: Variant = {
                variantName: variant.variant_name,
                templateVariantName: variant.previous_variant_name,
                persistent: true,
                parameters: variant.parameters
            }
            return v;
        });
    }

    return [];
}


export function callVariant(inputParamsDict: Record<string, string>, optParams: Parameter[], URIPath: string) {
    const inputParams = Object.keys(inputParamsDict).map(key => `${key}=${encodeURIComponent(inputParamsDict[key])}`).join('&');
    const OptParams = optParams.filter((param) => param.default).map(param => `${param.name}=${encodeURIComponent(param.default)}`).join('&');
    return axios.post(`${API_BASE_URL}/${URIPath}/generate?${inputParams}&${OptParams}`, {
        headers: {
            'accept': 'application/json',
        }
    }).then(res => res.data);
}

/**
 * Parses the openapi.json from a variant and returns the parameters as an array of objects.
 * @param app
 * @param variantName
 * @returns
 */
export const getVariantParameters = async (app: string, variant: Variant) => {
    try {
        const sourceName = variant.templateVariantName ? variant.templateVariantName : variant.variantName;
        const url = `${API_BASE_URL}/${app}/${sourceName}/openapi.json`;
        const response = await axios.get(url);
        const APIParams = parseOpenApiSchema(response.data);
        const initOptParams = APIParams.filter(param => (!param.input)); // contains the default values too!
        const inputParams = APIParams.filter(param => (param.input)); // don't have input values
        return { initOptParams, inputParams };
    } catch (error) {
        throw error;
    }
};


/**
 * Saves a new variant to the database based on previous
 */
export async function saveNewVariant(appName: string, variant: Variant, parameters: Parameter[]) {
    console.log(variant);
    const appVariant = {
        app_name: appName,
        variant_name: variant.templateVariantName,
    };
    console.log(parameters.reduce((acc, param) => { return { ...acc, [param.name]: param.default } }, {}))
    try {
        const response = await axios.post(`${API_BASE_URL}/api/app_variant/add/from_previous/`, {
            previous_app_variant: appVariant,
            new_variant_name: variant.variantName,
            parameters: parameters.reduce((acc, param) => { return { ...acc, [param.name]: param.default } }, {})
        });

        // You can use the response here if needed
        console.log(response.data);
    } catch (error) {
        console.error(error);
        // Handle error here
        throw error;
    }
}

export async function removeApp(appName: string) {
    try {
        await axios.delete(`${API_BASE_URL}/api/app_variant/remove_app/`, { data: { app_name: appName } });
        console.log("App removed: " + appName);
    } catch (error) {
        console.error("Error removing " + appName + " " + error);
        throw error;
    }
}


export async function removeVariant(appName: string, variantName: string) {
    try {
        await axios.delete(`${API_BASE_URL}/api/app_variant/remove_variant/`, { data: { app_name: appName, variant_name: variantName } });
        console.log("Variant removed: " + variantName);
    } catch (error) {
        console.error("Error removing " + variantName + " " + error);
        throw error;
    }
}
/**
 * Loads the list of datasets
 * @returns
 */
export const loadDatasetsList = (app_name: string) => {
    const { data, error } = useSWR(`${API_BASE_URL}/api/datasets?app_name=${app_name}`, fetcher)
    return {
        datasets: data,
        isDatasetsLoading: !error && !data,
        isDatasetsLoadingError: error
    }
};


const eval_endpoint = axios.create({
    baseURL: `${API_BASE_URL}/api/app_evaluations`,
});

export const updateAppEvaluations = async (evaluationTableId: string, data) => {
    const response = await eval_endpoint.put(`${API_BASE_URL}/${evaluationTableId}`, data);
    return response.data;
};

export const updateEvaluationRow = async (evaluationTableId: string, evaluationRowId: string, data) => {
    const response = await eval_endpoint.put(`${API_BASE_URL}/api/app_evaluations/${evaluationTableId}/evaluation_row/${evaluationRowId}`, data);
    return response.data;
};

export const postEvaluationRow = async (evaluationTableId: string, data) => {
    const response = await eval_endpoint.post(`${API_BASE_URL}/api/app_evaluations/${evaluationTableId}/evaluation_row`, data);
    return response.data;
};