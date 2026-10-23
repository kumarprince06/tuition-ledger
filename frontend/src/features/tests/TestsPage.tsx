import { can, myBatches, myBatchIds } from '../../mock/domain'
import { useStore } from '../../mock/store'
import { Empty, PageHead } from '../../shared/ui/kit'
import { useSheet } from '../../shared/ui/overlay'
import { TestRow } from '../classes/TestRow'
import { TestSheet } from '../sheets/classes'

export function TestsPage() {
  const { db } = useStore()
  const sheet = useSheet()
  const ts = db.tests
    .filter((t) => myBatchIds().includes(t.batchId))
    .sort((a, b) => b.heldOn.localeCompare(a.heldOn))
  return (
    <>
      <PageHead
        title="Tests"
        sub="Enter marks on your phone. Each parent gets only their own child's result; never a rank."
        actions={
          can('TEST_WRITE') &&
          myBatches().length > 0 && (
            <button className="btn btn-primary" onClick={() => sheet.open(<TestSheet />)}>
              Create a test
            </button>
          )
        }
      />
      <section className="card">
        {ts.length ? (
          <table className="rtable">
            <thead>
              <tr>
                <th>Test</th>
                <th>Date</th>
                <th className="num">Entered</th>
                <th className="num">Average</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ts.map((t) => (
                <TestRow key={t.id} t={t} />
              ))}
            </tbody>
          </table>
        ) : (
          <Empty title="No tests yet" sub="Create a test to start entering marks." />
        )}
      </section>
    </>
  )
}
