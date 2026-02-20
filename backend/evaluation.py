# ------------------------------------------------------------
# evaluation.py — BLEU & METEOR computation for live updates
# ------------------------------------------------------------
import re
from collections import Counter


# ------------------------------------------------------------
# Text Normalization
# ------------------------------------------------------------
def normalize_text(text):
    """Clean and normalize text for metric calculations."""
    if not text:
        return ""
    text = text.strip()
    # Remove punctuation but keep Hindi (Devanagari) and Latin characters
    text = re.sub(r'[^\w\s]', '', text, flags=re.UNICODE)
    text = re.sub(r'\s+', ' ', text).strip()
    return text.lower()


# ------------------------------------------------------------
# BLEU Calculation (smoothed sentence-level)
# ------------------------------------------------------------
def compute_bleu_score(references, hypotheses):
    """Compute smoothed BLEU score (0-1 scale) for a single sentence."""
    try:
        ref_tokens = normalize_text(references[0]).split()
        hyp_tokens = normalize_text(hypotheses[0]).split()

        if not ref_tokens or not hyp_tokens:
            return 0.0

        # Compute n-gram precisions for n=1..4
        precisions = []
        for n in range(1, 5):
            ref_ngrams = Counter()
            hyp_ngrams = Counter()
            for i in range(len(ref_tokens) - n + 1):
                ref_ngrams[tuple(ref_tokens[i:i+n])] += 1
            for i in range(len(hyp_tokens) - n + 1):
                hyp_ngrams[tuple(hyp_tokens[i:i+n])] += 1

            clipped = 0
            total = 0
            for ng in hyp_ngrams:
                clipped += min(hyp_ngrams[ng], ref_ngrams.get(ng, 0))
                total += hyp_ngrams[ng]

            if total == 0:
                # Smoothing: add 1 to avoid zero
                precisions.append(1.0 / (len(hyp_tokens) + 1))
            else:
                # Smoothing: add 1 to both numerator and denominator
                precisions.append((clipped + 1) / (total + 1))

        # Geometric mean of precisions
        import math
        log_avg = sum(math.log(p) for p in precisions) / 4.0

        # Brevity penalty
        bp = 1.0
        if len(hyp_tokens) < len(ref_tokens):
            bp = math.exp(1 - len(ref_tokens) / len(hyp_tokens))

        score = bp * math.exp(log_avg)
        return round(min(1.0, score), 4)
    except Exception as e:
        print("BLEU computation error:", e)
        return 0.0


# ------------------------------------------------------------
# METEOR Calculation (unigram-based F-score with fragmentation penalty)
# ------------------------------------------------------------
def compute_meteor_score(references, hypotheses):
    """
    Compute METEOR-like score (0-1 scale) using unigram precision/recall
    with F-mean (recall-weighted) and a fragmentation penalty.
    """
    try:
        ref_text = normalize_text(references[0])
        hyp_text = normalize_text(hypotheses[0])

        ref_tokens = ref_text.split()
        hyp_tokens = hyp_text.split()

        if not ref_tokens or not hyp_tokens:
            return 0.0

        # Count unigram matches (clipped)
        ref_counts = Counter(ref_tokens)
        hyp_counts = Counter(hyp_tokens)

        matches = 0
        for token in hyp_counts:
            if token in ref_counts:
                matches += min(hyp_counts[token], ref_counts[token])

        if matches == 0:
            return 0.0

        precision = matches / len(hyp_tokens)
        recall = matches / len(ref_tokens)

        # F-mean with alpha = 0.9 (recall-weighted, as in standard METEOR)
        alpha = 0.9
        denom = alpha * precision + (1.0 - alpha) * recall
        if denom == 0:
            return 0.0
        f_mean = (precision * recall) / denom

        # Fragmentation penalty
        # Count contiguous chunks of matched tokens in hypothesis
        chunks = 0
        in_chunk = False
        ref_set = set(ref_tokens)
        for token in hyp_tokens:
            if token in ref_set:
                if not in_chunk:
                    chunks += 1
                    in_chunk = True
            else:
                in_chunk = False

        if chunks > 0 and matches > 0:
            frag = chunks / matches
            penalty = 0.5 * (frag ** 3)
        else:
            penalty = 0.0

        score = f_mean * (1.0 - penalty)
        return round(max(0.0, min(1.0, score)), 4)
    except Exception as e:
        print("METEOR computation error:", e)
        return 0.0


# ------------------------------------------------------------
# Evaluation Dataset (used for similarity matching)
# ------------------------------------------------------------
EVALUATION_DATASET = [
    {"english": "Hello, how are you?", "hindi": "नमस्ते, आप कैसे हैं?"},
    {"english": "This is my car.", "hindi": "यह मेरी कार है।"},
    {"english": "The weather is nice today.", "hindi": "आज मौसम अच्छा है।"},
    {"english": "I love programming.", "hindi": "मुझे प्रोग्रामिंग पसंद है।"},
    {"english": "The sky is blue.", "hindi": "आसमान नीला है।"},
    {"english": "She is reading a book.", "hindi": "वह एक किताब पढ़ रही है।"},
    {"english": "We are going to school.", "hindi": "हम स्कूल जा रहे हैं।"}
]


# ------------------------------------------------------------
# Full Model Evaluation (for /evaluate endpoint)
# ------------------------------------------------------------
def evaluate_model_on_dataset(model_func, dataset):
    """Evaluate BLEU and METEOR across entire dataset."""
    try:
        total_bleu, total_meteor = 0, 0
        for pair in dataset:
            src, ref = pair["english"], pair["hindi"]
            pred = model_func(src)
            if isinstance(pred, dict):
                pred_text = pred.get("translation", "")
            else:
                pred_text = str(pred)
            total_bleu += compute_bleu_score([ref], [pred_text])
            total_meteor += compute_meteor_score([ref], [pred_text])

        avg_bleu = total_bleu / len(dataset)
        avg_meteor = total_meteor / len(dataset)

        return {
            "avg_bleu": round(avg_bleu, 4),
            "avg_meteor": round(avg_meteor, 4),
            "total_samples": len(dataset)
        }
    except Exception as e:
        print("Error evaluating model:", e)
        return {"avg_bleu": 0, "avg_meteor": 0, "total_samples": 0}
