import fs from "node:fs";
import path from "node:path";
import { parse, type ParseError } from "jsonc-parser";
import { z } from "zod";

type Migrations = Record<number, (data: any) => any>; // key = version it migrates TO

interface ConfigStoreOptions<S extends z.ZodTypeAny> {
  file: string;
  schema: S;
  description?: string; // written as a comment at the top of the file
  initial?: z.input<S>; // used when the file doesn't exist yet
  version?: number;
  migrations?: Migrations;
}

export class ConfigStore<S extends z.ZodObject> {
  /** The live config. Change it directly, then call save(). */
  config: z.infer<S>;

  private file: string;
  private schema: S;
  private description?: string;
  private version: number;

  constructor(opts: ConfigStoreOptions<S>) {
    this.file = opts.file;
    this.schema = opts.schema;
    this.description = opts.description ?? "";
    this.version = opts.version ?? 1;
    const migrations = opts.migrations ?? {};

    // no file yet: start from initial values (schema defaults fill the gaps), then create it
    if (!fs.existsSync(this.file)) {
      this.config = this.schema.parse(opts.initial ?? {});
      this.save();
      return;
    }

    // existing file: read (comments allowed) -> migrate -> validate
    const errors: ParseError[] = [];
    const raw = parse(fs.readFileSync(this.file, "utf8"), errors);
    if (errors.length) throw new Error(`Invalid config file: ${this.file}`);

    const fileVersion: number = raw.version ?? 1;
    let data = raw.data;

    for (let v = fileVersion + 1; v <= this.version; v++) {
      const migrate = migrations[v];
      if (!migrate) throw new Error(`Missing migration to v${v}`);
      data = migrate(data);
    }

    this.config = this.schema.parse(data);
    if (fileVersion < this.version) this.save(); // persist the migrated config
  }

  update(values: Partial<z.infer<S>>): void {
    Object.assign(this.config, values);
    this.save();
  }

  /** Validate this.config and write it to the file. */
  save(): void {
    this.config = this.schema.parse(this.config);
    const header = this.description
      ? this.description
          .split("\n")
          .map((line) => `// ${line}`)
          .join("\n") + "\n"
      : "";

    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(
      this.file,
      header +
        JSON.stringify({ version: this.version, data: this.config }, null, 2) +
        "\n",
    );
  }
}
