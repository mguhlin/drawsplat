import {privateSourceResponse} from './_lib/scheduled-blog/publication.mjs';
export const onRequest=context=>privateSourceResponse(context.request)||context.next();
