/**
 * !! NEW
 *  -> Definer to solve the problem of incorrect url or states
 * 
 * !! DEPRECATED
 *  -> Not really useful, wasted time
 * 
 * @brief Defines the structures that the redirect machine will use
 *        to decide if the url is allowed.
 * 
 */


import type {Role} from "../lib/api.ts"

/**
 * @brief Interface that defines a rule, the rules are composed of:
 * @param url a string containing a url of the page
 * @param allowed the roles allowed in that url
 * @param fallbackUrl the url to redirect to in case the "url" is not allowed in that moment
 */
interface RouteRule{
    url: string;
    allowed: Role[];
}

/**
 * @brief Record containing the base url for each role
 *        roles are defined in Role type in api.ts
 * 
 * Its always correct because it will show an error if any role is missing.
 */
export const ROLE_DASHBOARDS: Record<Role, string> = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    admin:   '/admin/dashboard',
};

/**
 * @brief array of route rules.
 */
export const SECURITY_RULES: RouteRule[] = [
    {
        url:            '/student',
        allowed:        ['student'] as Role[]
    },
    {
        url:            '/admin',
        allowed:        ['admin'] as Role[],
    },
    {
        url:            '/teacher',
        allowed:        ['teacher'] as Role[],
    },
    {
        url:            '/group',
        allowed:        ['admin'] as Role[],
    }
];

