const threshold = 0.9;

const toxicity = require('@tensorflow-models/toxicity');

toxicity.load(threshold).then(model => {
  const sentences = ["bruh moment"];

  model.classify(sentences).then(predictions => {

    console.log(JSON.stringify(predictions, null, 2));

  });
});