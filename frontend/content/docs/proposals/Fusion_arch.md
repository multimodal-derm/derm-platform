# Fusion Model Architecture Plan

### Input Contract
According to the proposal documents:

* **Vision output embedding size:** $B \times 1024$
* **NLP output embedding size:** $B \times 768$

Where $B$ is the batch size, the number of inputs taking the forward pass before updating the weights.

Since we are going to be concatenating the vision and NLP output vectors ($1024 + 768 = 1792$), the final input size for our baseline will be $B \times 1792$.

---

### Fusion Strategy
Our primary approach for merging these modalities will be **Cross-Attention Fusion**. 

While simple concatenation (Concat) will be documented and maintained as a baseline for ablation studies to measure performance gains, Cross-Attention allows the model to dynamically weigh the importance of visual features against textual context. 

Additionally, we are including a **placeholder for a medication input stream** as part of future work to incorporate patient treatment history into the diagnostic process.

---

### Classification Head
For the fusion model, we will be using a Multilayer Perceptron (MLP).

An MLP is the best fit because CV and NLP encoders have already finished the complex work of identifying spatial patterns in images and meaning in text. Since those encoders output "flat" vectors of numbers ($1024$ and $768$), there is no spatial grid or word sequence left for a CNN or RNN to process. The MLP acts as a fast, efficient "decision maker" that learns how these combined features correlate to predict six diagnostic classes.

* **Input Layer:** 1792
* **Output Layer:** 6
* **Architecture:** $1792 \to 512 \to 6$
* **Activation Function:** ReLU
* **Regularization:** Dropout ($p=0.5$)

**Output:** The 512 features are mapped to the six specific skin disease categories: ACK, BCC, MEL, NEV, SCC, and SEK.