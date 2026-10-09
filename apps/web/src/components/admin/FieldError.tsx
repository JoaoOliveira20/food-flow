import styles from "./admin.module.css";

type FieldErrorProps = {
  id: string;
  messages: string[] | undefined;
};

export function FieldError({ id, messages }: FieldErrorProps) {
  if (!messages?.length) return null;
  return (
    <p id={id} className={styles.fieldError}>
      {messages.join(" ")}
    </p>
  );
}
