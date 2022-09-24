const sampleCommandCallback = async ({ ack, respond }) => {
    try {
      await ack();
      await respond('are you a clickUp user?');
    } catch (error) {
      console.error(error);
    }
  };
  
  module.exports = { sampleCommandCallback }; 