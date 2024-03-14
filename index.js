import express from 'express'
import logger from 'morgan'

const PORT = process.env.PORT ?? 4321

const app = express()
app.disable('x-powered-by')
app.use(logger('dev'))
app.use(express.json())

app.get('/:formId/filteredResponses', async (req, res) => {
  //* Extract formId and filters from the request
  const formId = req.params.formId;
  const filters = JSON.parse(req.query.filters);

  console.log(formId);

  //* Call the Fillout API to get all responses for the formId
  const data = await fetch(`https://api.fillout.com/v1/api/forms/${formId}/submissions`, {
    headers: {
      Authorization: 'Bearer sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912'
    }
  })
  const allResponses = await data.json()

  // Apply filters to the responses
  const filteredResponses = allResponses.responses.filter(response => {
    // Check if each filter condition is satisfied
    return filters.every(filter => {
      const question = response.questions.find(q => q.id === filter.id);
      if (!question) return false; // Filtered question not found in the response

      switch (filter.condition) {
        case 'equals':
          return question.value === filter.value;
        case 'does_not_equal':
          return question.value !== filter.value;
        case 'greater_than':
          return Number(question.value) > Number(filter.value);
        case 'less_than':
          return Number(question.value) < Number(filter.value);
        default:
          return false; // Invalid filter condition
      }
    });
  });


  // Prepare the response with pagination
  const limit = Number(req.query.limit) || 150;
  const offset = Number(req.query.offset) || 0;
  const totalResponses = filteredResponses.length;
  const pageCount = Math.ceil(totalResponses / limit);
  const paginatedResponses = filteredResponses.slice(offset, offset + limit);

  // Send the response
  res.json({
    responses: paginatedResponses,
    totalResponses,
    pageCount
  });

})

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`)
}) 