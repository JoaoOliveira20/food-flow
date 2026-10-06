import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, createIngredient, deletePreset, updateIngredient, updatePreset } from "./mutations";

const fetchMock = vi.fn();

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test/");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("ingredient mutations", () => {
  it("creates an ingredient with a multipart request", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { data: { id: 9 } }));
    const image = new File(["png"], "queijo.png", { type: "image/png" });

    const created = await createIngredient(1, { name: "Queijo", displayWidth: 300, restingSurfaceRatio: 0.4, sinkRatio: 0.2 }, image);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/admin/builders/1/ingredients");
    expect(init.method).toBe("POST");
    const body = init.body as FormData;
    expect(body.get("name")).toBe("Queijo");
    expect(body.get("displayWidth")).toBe("300");
    expect((body.get("image") as File).name).toBe("queijo.png");
    expect(init.headers).not.toHaveProperty("Content-Type");
    expect(created).toEqual({ id: 9 });
  });

  it("sends a new image through POST with method spoofing", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { data: { id: 9 } }));

    await updateIngredient(9, { isVisible: true }, new File(["png"], "novo.png", { type: "image/png" }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/admin/ingredients/9");
    expect(init.method).toBe("POST");
    expect((init.body as FormData).get("_method")).toBe("PATCH");
    expect((init.body as FormData).get("isVisible")).toBe("1");
  });

  it("sends field changes without an image as JSON PATCH", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { data: { id: 9 } }));

    await updateIngredient(9, { isVisible: false });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("PATCH");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ isVisible: false });
  });

  it("exposes validation errors by field", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, { message: "Dados inválidos.", errors: { name: ["O campo nome é obrigatório."] } }),
    );

    const error = await updateIngredient(9, { name: "" }).catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.fieldErrors).toEqual({ name: ["O campo nome é obrigatório."] });
  });

  it("explains a request rejected for being too large, whose body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>413</html>", { status: 413 }));

    const error = await updateIngredient(9, {}, new File(["x"], "big.png")).catch((caught) => caught);

    expect(error.message).toBe("O arquivo é grande demais. Envie uma imagem de até 2 MB.");
  });

  it("explains when the API cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const error = await updateIngredient(9, { name: "X" }).catch((caught) => caught);

    expect(error.status).toBe(0);
    expect(error.message).toContain("pnpm dev:api");
  });
});

describe("preset mutations", () => {
  it("sends the ordered ingredient list as JSON", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { data: { id: 3 } }));

    await updatePreset(3, { ingredientIds: [1, 2, 1] });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ ingredientIds: [1, 2, 1] });
  });

  it("keeps the presets and message of a blocked deletion", async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { message: "O preset inicial não pode ser excluído." }));

    const error = await deletePreset(1).catch((caught) => caught);

    expect(error.status).toBe(409);
    expect(error.message).toBe("O preset inicial não pode ser excluído.");
  });

  it("accepts an empty response for deletions", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deletePreset(4)).resolves.toBeUndefined();
  });
});
