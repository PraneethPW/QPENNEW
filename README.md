 HEAD
# QPENNEW


## Requirements
- torch==1.7.1
- numpy==1.23.3
- transformers==4.23.1 (You can also use the static version in this repo)
- sentencepiece==0.1.97
- tokenizer==0.13.1
- sacremoses==0.0.53
- tqdm==4.64.1


##  Quick Start
- Download the pre-trained multilingual language model mBERT or XLM-R
- To quickly reproduce the results with French (`fr`) as the target langauge and mBERT (`mbert`) as the backbone under the supervised setting:
```python
python main.py --tfm_type mbert --tgt_lang fr
```
```shell
sh run_qpen.sh
```
- To reproduce other results, ref to the `data_utils.py` for details


## Usage
To run experiments under different settings, change the `exp_type` setting:
  * `supervised` refers to the supervised setting
  * `acs` is the proposed method


Two example scripts:
- `run_qpen.sh` provides an example to run basic experiment.

## Web App
- Start the local frontend + backend web app with:
```python
C:\Users\prane\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe app_server.py
```
- Open:
  * `http://127.0.0.1:8000/` for the landing page
  * `http://127.0.0.1:8000/app` for the main inference workspace

The web app discovers local checkpoints from `outputs/`, surfaces detected dataset languages from `data/rest/`, and runs token-level BIOES inference through the backend API.
 f172bd1 (Prepare QPEN for deployment)
