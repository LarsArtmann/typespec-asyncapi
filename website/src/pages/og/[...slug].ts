import { getCollection } from "astro:content";
import { OGImageRoute } from "astro-og-canvas";

const docs = await getCollection("docs");
const docPages = Object.fromEntries(docs.map(({ data, id }) => [id, { data }]));

const pages = {
  ...docPages,
  home: {
    data: {
      title: "typespec-asyncapi",
      description:
        "Stop hand-writing AsyncAPI YAML. Model your event-driven API in TypeSpec and emit AsyncAPI 3.1 specs validated against the official JSON Schema.",
    },
  },
};

export const { getStaticPaths, GET } = await OGImageRoute({
  // @ts-expect-error param is required at runtime by astro-og-canvas (avoids PrerenderDynamicEndpointPathCollide) but absent from OGImageRouteConfig types
  param: "slug",
  pages,
  getImageOptions: (_path, page) => ({
    title: page.data.title,
    description: page.data.description,
    bgGradient: [[10, 9, 8]],
    border: { color: [20, 184, 166], width: 4 },
    padding: 80,
  }),
});
