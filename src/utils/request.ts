export async function get<T extends AnyObject>(options: {
  url: string;
  data?: AnyObject;
}): Promise<T> {
  const { url, data } = options;
  const queryString = data
    ? Object.entries(data)
        .map(([key, value]) => `${key}=${value}`)
        .join("&")
    : "";
  const res = await fetch(`${url}?${queryString}`);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function post<T extends AnyObject>(options: {
  url: string;
  data: AnyObject;
}): Promise<T> {
  const { url, data } = options;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function put<T extends AnyObject>(options: {
  url: string;
  data: AnyObject;
}): Promise<T> {
  const { url, data } = options;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function del<T extends AnyObject>(options: {
  url: string;
}): Promise<T> {
  const { url } = options;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}
