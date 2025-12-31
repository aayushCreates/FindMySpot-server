import fastify from 'fastify';
import dotenv from 'dotenv';

const app = fastify({
    logger: true
});

dotenv.config();



const port = Number(process.env.PORT) || 8080;
app.listen({ port }, (err, address)=> {
    if (err) {
        app.log.error(err);
        process.exit(1);
      }
      console.log(`🚀 Server running at ${address}`);
})
