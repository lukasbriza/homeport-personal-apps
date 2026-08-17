type GreetingProps = {
  title: string
  description: string
}

// Feature-local presentational component. Lives with its feature (modules/home/components).
// Promote to src/components only once a second feature needs it.
export const Greeting = ({ title, description }: GreetingProps) => (
  <section>
    <h1>{title}</h1>
    <p>{description}</p>
  </section>
)
