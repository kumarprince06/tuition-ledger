import { Link } from 'react-router'
import { PageHead } from '../shared/ui/kit'

export const NotFound = () => (
  <PageHead
    title="Not found"
    sub="This page doesn't exist or you don't have access to it."
    actions={
      <Link className="btn" to="/">
        Go to Today
      </Link>
    }
  />
)
